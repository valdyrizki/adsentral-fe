export interface SystemSettingRequest {
  key: string;
  value: string;
  description?: string;
  group?: string;
  is_public: boolean;
}
