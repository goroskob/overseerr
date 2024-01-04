import TheMovieDb from '@server/api/themoviedb';
import type { TmdbTvDetails } from '@server/api/themoviedb/interfaces';
import type { SonarrSettings } from '@server/lib/settings';
import { type SonarrOverrideSettings } from '@server/lib/settings';

export class OverrideSettings {
  async getOverrides(
    tmdbId: number,
    sonarrSettings: SonarrSettings
  ): Promise<SonarrOverrideSettings['override'] | undefined> {
    const series = await new TheMovieDb().getTvShow({ tvId: tmdbId });

    let heaviestOverride:
      | { override: SonarrOverrideSettings['override']; weight: number }
      | undefined;

    sonarrSettings.overrides?.forEach((setting) => {
      const weight = this.computeOverrideWeight(setting.rule, series);
      if (weight > (heaviestOverride?.weight ?? 0)) {
        heaviestOverride = {
          override: setting.override,
          weight,
        };
      }
    });

    const override = heaviestOverride?.override;

    console.log('All overrides:', sonarrSettings.overrides);
    console.log('Found override:', override);

    return (
      override && {
        ...override,
        tags: override?.tags?.length ? override.tags : undefined,
      }
    );
  }

  private computeOverrideWeight(
    rule: SonarrOverrideSettings['rule'],
    series: TmdbTvDetails
  ) {
    let weight = 0;
    if (rule.genres && rule.genres.length > 0) {
      weight =
        (weight + 1) *
        series.genres.filter((genre) => rule.genres?.includes(genre.id)).length;
    }

    if (rule.keywords && rule.keywords.length > 0)
      weight =
        (weight + 1) *
        series.keywords.results.filter((keyword) =>
          rule.keywords?.includes(keyword.id)
        ).length;

    if (rule.languages && rule.languages.length > 0)
      weight =
        (weight + 1) *
        (rule.languages?.includes(series.original_language) ? 1 : 0);

    return weight;
  }
}
