export interface PageResponse<T = unknown> {
  page : number
  size : number
  total_elements : number
  total_pages : number
  last : boolean
  content : T
}