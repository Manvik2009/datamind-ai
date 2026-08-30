import { z } from 'zod';

export const createDatasetSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

export const datasetIdParamsSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const createExperimentSchema = z.object({
  body: z.object({
    dataset_id: z.string().uuid(),
    name: z.string().min(1).max(255),
    target_column: z.string().min(1),
    problem_type: z.enum(['classification', 'regression']).optional(),
    test_size: z.number().min(0.1).max(0.5).default(0.2),
    random_seed: z.number().int().default(42),
    selected_features: z.array(z.string()).optional(),
    selected_models: z.array(z.string()).optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

export const experimentIdParamsSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const trainExperimentSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const createPredictionSchema = z.object({
  body: z.object({
    dataset_id: z.string().uuid(),
    experiment_id: z.string().uuid(),
    model_id: z.string().uuid(),
    input_data: z.record(z.unknown()),
  }),
  query: z.object({}),
  params: z.object({}),
});

export const batchPredictionSchema = z.object({
  body: z.object({
    dataset_id: z.string().uuid(),
    experiment_id: z.string().uuid(),
    model_id: z.string().uuid(),
    records: z.array(z.record(z.unknown())).min(1).max(10000),
    async: z.boolean().optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

export const createScenarioSchema = z.object({
  body: z.object({
    dataset_id: z.string().uuid(),
    experiment_id: z.string().uuid(),
    model_id: z.string().uuid(),
    baseline_input: z.record(z.unknown()),
    scenario_input: z.record(z.unknown()),
    scenario_name: z.string().max(255).optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

export const compareScenariosSchema = z.object({
  body: z.object({
    dataset_id: z.string().uuid(),
    experiment_id: z.string().uuid(),
    model_id: z.string().uuid(),
    scenario_ids: z.array(z.string().uuid()).min(2).max(10),
  }),
  query: z.object({}),
  params: z.object({}),
});

export const sensitivitySchema = z.object({
  body: z.object({
    dataset_id: z.string().uuid(),
    experiment_id: z.string().uuid(),
    model_id: z.string().uuid(),
    feature_name: z.string().min(1),
    base_input: z.record(z.unknown()),
    values: z.array(z.union([z.string(), z.number(), z.boolean()])).min(1).max(50),
    async: z.boolean().optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

export const createRecommendationSchema = z.object({
  body: z.object({
    dataset_id: z.string().uuid(),
    experiment_id: z.string().uuid(),
    title: z.string().min(1).max(255),
    description: z.string().min(1),
    impact_area: z.enum(['data_quality', 'model_quality', 'customer_segment', 'operations', 'investigation']),
    evidence: z.array(z.unknown()).optional(),
    confidence: z.enum(['low', 'medium', 'high']).optional(),
    limitations: z.array(z.unknown()).optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

export const createReportSchema = z.object({
  body: z.object({
    dataset_id: z.string().uuid(),
    experiment_id: z.string().uuid(),
    content: z.record(z.unknown()),
    report_type: z.string().max(50).optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

export const aiExplainDecisionSchema = z.object({
  body: z.object({
    dataset_id: z.string().uuid(),
    experiment_id: z.string().uuid(),
    model_id: z.string().uuid(),
    input_data: z.record(z.unknown()),
  }),
  query: z.object({}),
  params: z.object({}),
});

export const aiAnalyzeSchema = z.object({
  body: z.object({
    dataset_id: z.string().uuid(),
    experiment_id: z.string().uuid(),
    question: z.string().min(1).max(1000),
  }),
  query: z.object({}),
  params: z.object({}),
});

export const aiRecommendationsSchema = z.object({
  body: z.object({
    dataset_id: z.string().uuid(),
    experiment_id: z.string().uuid(),
  }),
  query: z.object({}),
  params: z.object({}),
});

export const aiReportSchema = z.object({
  body: z.object({
    dataset_id: z.string().uuid(),
    experiment_id: z.string().uuid(),
  }),
  query: z.object({}),
  params: z.object({}),
});

export const aiQuerySchema = z.object({
  body: z.object({
    dataset_id: z.string().uuid(),
    question: z.string().min(1).max(1000),
  }),
  query: z.object({}),
  params: z.object({}),
});

export const paginationQuerySchema = z.object({
  body: z.object({}),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
  params: z.object({}),
});
