export interface WebResponse<T = unknown> {
  status : string
  message : string
  data? : T
  errors? : string | string[] | Record<string, string>
}