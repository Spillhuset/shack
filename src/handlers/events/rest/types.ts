export enum NumBool { False, True }

export type RESTNextResponse = Record<`${number}`, {
  cancelled: NumBool;
  crew_only: NumBool;
  datetime_end: number;
  datetime_start: number;
  description?: string;
  location: {
    id: number;
    name: string;
    postal_code: number;
    street_name: string;
    street_number: string;
  };
  members_only: NumBool;
  title: string;
}>;

export type RESTCurrentResponse = Record<`${number}`, { name: string }>;
