import TheMovieDb from '@server/api/themoviedb';
import type { TmdbTvDetails } from '@server/api/themoviedb/interfaces';
import type { SonarrSettings } from '@server/lib/settings';
import { type SonarrOverrideSettings } from '@server/lib/settings';
import logger from '@server/logger';

export class OverrideSettings {
  async getOverrides(tmdbId: number, sonarrSettings: SonarrSettings) {
    const series = await new TheMovieDb().getTvShow({ tvId: tmdbId });

    let mostWeightedOverride:
      | { settings: SonarrOverrideSettings; weight: number }
      | undefined;

    sonarrSettings.overrideSettings?.forEach((override) => {
      const weight = this.computeOverrideWeight(override, series);
      if (weight > (mostWeightedOverride?.weight ?? 0)) {
        mostWeightedOverride = {
          settings: override,
          weight: weight,
        };
      }
    });

    let overrideDirectory: string | undefined;
    let overrideTags: number[] | undefined;
    if (mostWeightedOverride) {
      if (mostWeightedOverride.settings.rootFolder) {
        overrideDirectory = mostWeightedOverride.settings.rootFolder;
        logger.info(
          `Override Settings matched root folder: ${overrideDirectory}`,
          {
            mediaId: tmdbId,
          }
        );
      }
      if (mostWeightedOverride.settings.tags.length > 0) {
        overrideTags = [
          ...sonarrSettings.tags,
          ...mostWeightedOverride.settings.tags,
        ];
        logger.info(`Override Settings matched tags`, {
          label: 'Media Request',
          mediaId: tmdbId,
          tagIds: overrideTags,
        });
      }
    }

    return { overrideDirectory, overrideTags };
  }

  private computeOverrideWeight(
    override: SonarrOverrideSettings,
    series: TmdbTvDetails
  ) {
    let weight = 1;
    if (override.genres && override.genres.length > 0)
      weight *= series.genres.filter((genre) =>
        override.genres?.includes(genre.id)
      ).length;

    if (override.keywords && override.keywords.length > 0)
      weight *= series.keywords.results.filter((keyword) =>
        override.keywords?.includes(keyword.id)
      ).length;

    if (override.languages && override.languages.length > 0)
      weight *= series.languages.filter((lang) =>
        override.languages?.includes(lang)
      ).length;

    return weight;
  }
}
