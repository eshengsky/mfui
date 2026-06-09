export type JsonObject = Record<string, unknown>;

export type JsonSchema = JsonObject;

export type Projection = {
  text: string;
};

export type ProjectionTemplates = {
  text: string;
};

export type ComponentModelHints = {
  description: string;
  whenToUse?: string;
  examples?: Array<{
    user: string;
    spec: unknown;
  }>;
};

export type ComponentManifest = {
  name: string;
  schema: JsonSchema;
  projection: ProjectionTemplates;
  model?: ComponentModelHints;
  metadata?: JsonObject;
};

export type LayoutManifest = {
  name: string;
  model?: ComponentModelHints;
  metadata?: JsonObject;
};

export type MFUIManifest = {
  components: ComponentManifest[];
  layouts?: LayoutManifest[];
};

export type TextPart = {
  id: string;
  type: 'text';
  content: string;
  metadata?: JsonObject;
};

export type ComponentPart<TSpec = unknown> = {
  id: string;
  type: 'component';
  component: string;
  spec: TSpec;
  projection?: Projection;
  metadata?: JsonObject;
};

export type ProjectedComponentPart<TSpec = unknown> =
  Omit<ComponentPart<TSpec>, 'projection'> & {
    projection: Projection;
  };

export type ColumnCell<TSpec = unknown> =
  | TextPart
  | ComponentPart<TSpec>;

export type ProjectedColumnCell<TSpec = unknown> =
  | TextPart
  | ProjectedComponentPart<TSpec>;

export type ColumnsLayoutPart<TSpec = unknown> = {
  id: string;
  type: 'layout';
  layout: 'mfui.columns';
  columns: Array<ColumnCell<TSpec>>;
  projection?: Projection;
  metadata?: JsonObject;
};

export type ProjectedColumnsLayoutPart<TSpec = unknown> =
  Omit<ColumnsLayoutPart<TSpec>, 'columns' | 'projection'> & {
    columns: Array<ProjectedColumnCell<TSpec>>;
    projection: Projection;
  };

export type LayoutPart<TSpec = unknown> = ColumnsLayoutPart<TSpec>;

export type ProjectedLayoutPart<TSpec = unknown> =
  ProjectedColumnsLayoutPart<TSpec>;

export type MessagePart<TSpec = unknown> =
  | TextPart
  | ComponentPart<TSpec>
  | LayoutPart<TSpec>;

export type ProjectedMessagePart<TSpec = unknown> =
  | TextPart
  | ProjectedComponentPart<TSpec>
  | ProjectedLayoutPart<TSpec>;

export type MessageIR<TSpec = unknown> = {
  id: string;
  parts: Array<MessagePart<TSpec>>;
  metadata?: JsonObject;
};

export type ProjectedMessage<TSpec = unknown> =
  Omit<MessageIR<TSpec>, 'parts'> & {
    parts: Array<ProjectedMessagePart<TSpec>>;
    portableText: string;
  };

export type MessageStartEvent = {
  type: 'message.start';
  id: string;
  createdAt?: string;
};

export type TextDeltaEvent = {
  type: 'text.delta';
  partId: string;
  text: string;
};

export type ComponentSnapshotEvent<TSpec = unknown> = {
  type: 'component.snapshot';
  partId: string;
  component: string;
  spec: TSpec;
  projection: Projection;
  metadata?: JsonObject;
};

export type LayoutSnapshotEvent<TSpec = unknown> = {
  type: 'layout.snapshot';
  partId: string;
  layout: 'mfui.columns';
  columns: Array<ProjectedColumnCell<TSpec>>;
  projection: Projection;
  metadata?: JsonObject;
};

export type MessageEndEvent = {
  type: 'message.end';
  id: string;
  portableText: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};

export type ErrorEvent = {
  type: 'error';
  code: string;
  message: string;
  recoverable?: boolean;
};

export type SemanticStreamEvent<TSpec = unknown> =
  | MessageStartEvent
  | TextDeltaEvent
  | ComponentSnapshotEvent<TSpec>
  | LayoutSnapshotEvent<TSpec>
  | MessageEndEvent
  | ErrorEvent;

export type ValidationSuccess = {
  ok: true;
};

export type ValidationFailure = {
  ok: false;
  errors: string[];
};

export type ValidationResult = ValidationSuccess | ValidationFailure;
