import TheMovieDb from '@server/api/themoviedb';
import type { TmdbTvDetails } from '@server/api/themoviedb/interfaces';
import { type DVRSettings, type OverrideSetting } from '@server/lib/settings';
import logger from '@server/logger';
import _ from 'lodash';

export class OverrideSettings {
  async getOverrides(
    tmdbId: number,
    sonarrSettings: DVRSettings
  ): Promise<OverrideSetting['override'] | undefined> {
    if (!sonarrSettings.overrides) {
      logger.info('No Settings Overrides configured. Skipping overrides.', {
        mediaId: tmdbId,
      });

      return Promise.resolve(undefined);
    }

    const series = await new TheMovieDb().getTvShow({ tvId: tmdbId });

    const weightedOverrides = sonarrSettings.overrides
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
    series: TmdbTvDetails
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
      const ruleWeight = series.keywords.results.filter((keyword) =>
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
