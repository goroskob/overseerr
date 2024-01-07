import TheMovieDb from '@server/api/themoviedb';
import { type TmdbKeyword } from '@server/api/themoviedb/interfaces';
import {
  type DVRSettings,
  type OverrideSetting,
  type RadarrSettings,
  type SonarrSettings,
} from '@server/lib/settings';
import logger from '@server/logger';
import _ from 'lodash';

interface MediaDetails {
  genres: {
    id: number;
    name: string;
  }[];
  keywords: TmdbKeyword[];
  original_language: string;
}

export class OverrideSettings {
  async getTvOverrides(
    tmdbId: number,
    settings: SonarrSettings
  ): Promise<OverrideSetting['override'] | undefined> {
    const series = await new TheMovieDb().getTvShow({ tvId: tmdbId });
    return this.getOverridesForMedia(settings, tmdbId, {
      genres: series.genres,
      original_language: series.original_language,
      keywords: series.keywords.results,
    });
  }

  async getMovieOverrides(
    tmdbId: number,
    settings: RadarrSettings
  ): Promise<OverrideSetting['override'] | undefined> {
    const movie = await new TheMovieDb().getMovie({ movieId: tmdbId });
    return this.getOverridesForMedia(settings, tmdbId, {
      genres: movie.genres,
      original_language: movie.original_language,
      keywords: movie.keywords.keywords,
    });
  }

  private getOverridesForMedia(
    settings: DVRSettings,
    tmdbId: number,
    series: MediaDetails
  ) {
    if (!settings.overrides) {
      logger.info('No Settings Overrides configured. Skipping overrides.', {
        mediaId: tmdbId,
      });

      return Promise.resolve(undefined);
    }

    const weightedOverrides = settings.overrides
      .map((setting) => ({
        ...setting,
        weight: this.computeOverrideWeight(setting.rule, series),
      }))
      .filter((overrides) => overrides.weight);

    const override = _.maxBy(weightedOverrides, (o) => o.weight)?.override;

    logger.info('Settings Override matched for a media', {
      mediaId: tmdbId,
      weightedOverrides,
      override,
    });

    return (
      override && {
        ...override,
        tags: override?.tags?.length ? override.tags : undefined,
      }
    );
  }

  private computeOverrideWeight(
    rule: OverrideSetting['rule'],
    series: MediaDetails
  ) {
    let weight = 0;

    if (rule.genres && rule.genres.length > 0) {
      const ruleWeight = series.genres.filter((genre) =>
        rule.genres?.includes(genre.id)
      ).length;

      if (!ruleWeight) return 0;

      weight = (weight + 1) * ruleWeight;
    }

    if (rule.keywords && rule.keywords.length > 0) {
      const ruleWeight = series.keywords.filter((keyword) =>
        rule.keywords?.includes(keyword.id)
      ).length;

      if (!ruleWeight) return 0;

      weight = (weight + 1) * ruleWeight;
    }

    if (rule.languages && rule.languages.length > 0) {
      const ruleWeight = rule.languages?.includes(series.original_language)
        ? 1
        : 0;

      if (!ruleWeight) return 0;

      weight = (weight + 1) * ruleWeight;
    }

    return weight;
  }
}
