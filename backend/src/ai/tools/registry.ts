export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  authorize: (context: { dataset_id?: string; experiment_id?: string; user_id?: string }) => boolean;
  handler?: (input: Record<string, unknown>, context: { dataset_id?: string; experiment_id?: string; user_id?: string }) => Promise<Record<string, unknown>>;
}

export const AI_TOOLS: ToolDefinition[] = [
  {
    name: 'get_dataset_profile',
    description: 'Retrieve dataset profile including rows, columns, missing values, duplicates, and column details',
    input_schema: {
      type: 'object',
      properties: {
        dataset_id: { type: 'string', format: 'uuid' },
      },
      required: ['dataset_id'],
    },
    output_schema: {
      type: 'object',
      properties: {
        rows: { type: 'number' },
        columns: { type: 'number' },
        missing_values: { type: 'number' },
        duplicate_rows: { type: 'number' },
        columns_detail: { type: 'array' },
        quality_score: { type: 'number' },
      },
    },
    authorize: (ctx) => !!ctx.dataset_id,
  },
  {
    name: 'get_column_statistics',
    description: 'Retrieve statistical summaries for dataset columns',
    input_schema: {
      type: 'object',
      properties: {
        dataset_id: { type: 'string', format: 'uuid' },
      },
      required: ['dataset_id'],
    },
    output_schema: {
      type: 'object',
      properties: {
        statistics: { type: 'object' },
      },
    },
    authorize: (ctx) => !!ctx.dataset_id,
  },
  {
    name: 'get_missing_value_report',
    description: 'Retrieve missing value analysis for a dataset',
    input_schema: {
      type: 'object',
      properties: {
        dataset_id: { type: 'string', format: 'uuid' },
      },
      required: ['dataset_id'],
    },
    output_schema: {
      type: 'object',
      properties: {
        total_missing: { type: 'number' },
        total_percentage: { type: 'number' },
        columns: { type: 'array' },
      },
    },
    authorize: (ctx) => !!ctx.dataset_id,
  },
  {
    name: 'get_correlation',
    description: 'Retrieve correlation analysis for numerical columns',
    input_schema: {
      type: 'object',
      properties: {
        dataset_id: { type: 'string', format: 'uuid' },
      },
      required: ['dataset_id'],
    },
    output_schema: {
      type: 'object',
      properties: {
        matrix: { type: 'object' },
        relationships: { type: 'array' },
      },
    },
    authorize: (ctx) => !!ctx.dataset_id,
  },
  {
    name: 'get_model_metrics',
    description: 'Retrieve ML experiment metrics and model comparison',
    input_schema: {
      type: 'object',
      properties: {
        experiment_id: { type: 'string', format: 'uuid' },
      },
      required: ['experiment_id'],
    },
    output_schema: {
      type: 'object',
      properties: {
        problem_type: { type: 'string' },
        best_model: { type: 'object' },
        comparison: { type: 'array' },
      },
    },
    authorize: (ctx) => !!ctx.experiment_id,
  },
  {
    name: 'get_feature_importance',
    description: 'Retrieve feature importance from the best model in an experiment',
    input_schema: {
      type: 'object',
      properties: {
        experiment_id: { type: 'string', format: 'uuid' },
      },
      required: ['experiment_id'],
    },
    output_schema: {
      type: 'object',
      properties: {
        feature_importance: { type: 'object' },
      },
    },
    authorize: (ctx) => !!ctx.experiment_id,
  },
  {
    name: 'run_prediction',
    description: 'Generate a prediction using a trained model for given feature values',
    input_schema: {
      type: 'object',
      properties: {
        dataset_id: { type: 'string', format: 'uuid' },
        experiment_id: { type: 'string', format: 'uuid' },
        model_id: { type: 'string', format: 'uuid' },
        input_data: { type: 'object', description: 'Feature values for prediction' },
      },
      required: ['dataset_id', 'experiment_id', 'model_id', 'input_data'],
    },
    output_schema: {
      type: 'object',
      properties: {
        prediction: { type: 'object' },
        probability: { type: 'object' },
        feature_contributions: { type: 'object' },
      },
    },
    authorize: (ctx) => !!ctx.dataset_id && !!ctx.experiment_id,
  },
  {
    name: 'run_batch_prediction',
    description: 'Generate predictions for multiple records using a trained model',
    input_schema: {
      type: 'object',
      properties: {
        dataset_id: { type: 'string', format: 'uuid' },
        experiment_id: { type: 'string', format: 'uuid' },
        model_id: { type: 'string', format: 'uuid' },
        records: { type: 'array', items: { type: 'object' }, description: 'Array of feature value objects' },
      },
      required: ['dataset_id', 'experiment_id', 'model_id', 'records'],
    },
    output_schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        successful: { type: 'number' },
        failed: { type: 'number' },
        predictions: { type: 'array' },
      },
    },
    authorize: (ctx) => !!ctx.dataset_id && !!ctx.experiment_id,
  },
  {
    name: 'run_scenario',
    description: 'Run a what-if scenario comparing baseline and modified feature values',
    input_schema: {
      type: 'object',
      properties: {
        dataset_id: { type: 'string', format: 'uuid' },
        experiment_id: { type: 'string', format: 'uuid' },
        model_id: { type: 'string', format: 'uuid' },
        baseline_input: { type: 'object', description: 'Original feature values' },
        scenario_input: { type: 'object', description: 'Modified feature values' },
        scenario_name: { type: 'string' },
      },
      required: ['dataset_id', 'experiment_id', 'model_id', 'baseline_input', 'scenario_input'],
    },
    output_schema: {
      type: 'object',
      properties: {
        scenario_name: { type: 'string' },
        baseline_prediction: { type: 'object' },
        scenario_prediction: { type: 'object' },
        difference: { type: 'object' },
      },
    },
    authorize: (ctx) => !!ctx.dataset_id && !!ctx.experiment_id,
  },
  {
    name: 'compare_scenarios',
    description: 'Compare multiple what-if scenarios side by side',
    input_schema: {
      type: 'object',
      properties: {
        dataset_id: { type: 'string', format: 'uuid' },
        experiment_id: { type: 'string', format: 'uuid' },
        model_id: { type: 'string', format: 'uuid' },
        scenario_ids: { type: 'array', items: { type: 'string' } },
      },
      required: ['dataset_id', 'experiment_id', 'model_id', 'scenario_ids'],
    },
    output_schema: {
      type: 'object',
      properties: {
        scenarios: { type: 'array' },
        summary: { type: 'object' },
      },
    },
    authorize: (ctx) => !!ctx.dataset_id && !!ctx.experiment_id,
  },
  {
    name: 'run_sensitivity_analysis',
    description: 'Analyze how changing a single feature affects model predictions',
    input_schema: {
      type: 'object',
      properties: {
        dataset_id: { type: 'string', format: 'uuid' },
        experiment_id: { type: 'string', format: 'uuid' },
        model_id: { type: 'string', format: 'uuid' },
        feature_name: { type: 'string', description: 'Feature to analyze' },
        base_input: { type: 'object', description: 'Base feature values' },
        values: { type: 'array', description: 'Values to test' },
      },
      required: ['dataset_id', 'experiment_id', 'model_id', 'feature_name', 'base_input', 'values'],
    },
    output_schema: {
      type: 'object',
      properties: {
        feature_name: { type: 'string' },
        values: { type: 'array' },
        predictions: { type: 'array' },
      },
    },
    authorize: (ctx) => !!ctx.dataset_id && !!ctx.experiment_id,
  },
  {
    name: 'get_prediction_distribution',
    description: 'Retrieve distribution of predictions from previous runs',
    input_schema: {
      type: 'object',
      properties: {
        dataset_id: { type: 'string', format: 'uuid' },
        experiment_id: { type: 'string', format: 'uuid' },
      },
      required: ['dataset_id', 'experiment_id'],
    },
    output_schema: {
      type: 'object',
      properties: {
        total_predictions: { type: 'number' },
        distribution: { type: 'object' },
      },
    },
    authorize: (ctx) => !!ctx.dataset_id && !!ctx.experiment_id,
  },
  {
    name: 'get_decision_factors',
    description: 'Retrieve the most important factors driving model predictions',
    input_schema: {
      type: 'object',
      properties: {
        experiment_id: { type: 'string', format: 'uuid' },
      },
      required: ['experiment_id'],
    },
    output_schema: {
      type: 'object',
      properties: {
        factors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string' },
              importance: { type: 'number' },
              direction: { type: 'string' },
              evidence_source: { type: 'string' },
            },
          },
        },
      },
    },
    authorize: (ctx) => !!ctx.experiment_id,
  },
];

export const getAllowedTools = (context: { dataset_id?: string; experiment_id?: string }): ToolDefinition[] => {
  return AI_TOOLS.filter((tool) => tool.authorize(context));
};

export const getToolByName = (name: string): ToolDefinition | undefined => {
  return AI_TOOLS.find((tool) => tool.name === name);
};
