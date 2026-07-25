using System.Text.Json.Serialization;

namespace MyApi.Modules.Processes.DTOs
{
    public class ProcessScheduleDto
    {
        [JsonPropertyName("key")] public string Key { get; set; } = string.Empty;
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
        [JsonPropertyName("enabled")] public bool Enabled { get; set; }
        [JsonPropertyName("paused")] public bool Paused { get; set; }
        [JsonPropertyName("interval_minutes")] public int IntervalMinutes { get; set; }
        [JsonPropertyName("max_retries")] public int MaxRetries { get; set; }
        [JsonPropertyName("retry_backoff_seconds")] public int RetryBackoffSeconds { get; set; }
        [JsonPropertyName("config")] public object Config { get; set; } = new { };
        [JsonPropertyName("timezone")] public string Timezone { get; set; } = "UTC";
        [JsonPropertyName("next_run_at")] public DateTime? NextRunAt { get; set; }
        [JsonPropertyName("last_run_at")] public DateTime? LastRunAt { get; set; }
        [JsonPropertyName("last_status")] public string? LastStatus { get; set; }
        [JsonPropertyName("consecutive_failures")] public int ConsecutiveFailures { get; set; }
        [JsonPropertyName("block_reason")] public string? BlockReason { get; set; }
        [JsonPropertyName("updated_at")] public DateTime UpdatedAt { get; set; }
    }

    public class UpsertScheduleRequest
    {
        public string Key { get; set; } = string.Empty;
        public string? Name { get; set; }
        public bool? Enabled { get; set; }
        public bool? Paused { get; set; }
        public int? IntervalMinutes { get; set; }
        public int? MaxRetries { get; set; }
        public int? RetryBackoffSeconds { get; set; }
        public object? Config { get; set; }
        public string? Timezone { get; set; }
    }

    public class ProcessRunDto
    {
        [JsonPropertyName("id")] public long Id { get; set; }
        [JsonPropertyName("process_key")] public string ProcessKey { get; set; } = string.Empty;
        [JsonPropertyName("triggered_by")] public string TriggeredBy { get; set; } = "schedule";
        [JsonPropertyName("attempt")] public int Attempt { get; set; }
        [JsonPropertyName("status")] public string Status { get; set; } = "running";
        [JsonPropertyName("started_at")] public DateTime StartedAt { get; set; }
        [JsonPropertyName("finished_at")] public DateTime? FinishedAt { get; set; }
        [JsonPropertyName("duration_ms")] public int? DurationMs { get; set; }
        [JsonPropertyName("items_processed")] public int? ItemsProcessed { get; set; }
        [JsonPropertyName("error")] public string? Error { get; set; }
        [JsonPropertyName("block_reason")] public string? BlockReason { get; set; }
        [JsonPropertyName("next_retry_at")] public DateTime? NextRetryAt { get; set; }
    }

    public class RunNowResult
    {
        [JsonPropertyName("status")] public string Status { get; set; } = "success";
        [JsonPropertyName("duration_ms")] public int DurationMs { get; set; }
        [JsonPropertyName("items_processed")] public int? ItemsProcessed { get; set; }
        [JsonPropertyName("error")] public string? Error { get; set; }
        [JsonPropertyName("block_reason")] public string? BlockReason { get; set; }
        [JsonPropertyName("output")] public object? Output { get; set; }
    }
}
