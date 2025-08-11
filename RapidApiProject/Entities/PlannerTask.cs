namespace RapidApiProject.Entities
{
    public class PlannerTask
    {
        public int Id { get; set; }                    
        public string Title { get; set; } = "";
        public string? Notes { get; set; }
        public DateTime? ScheduledDate { get; set; }    
        public string Scope { get; set; } = "day";      
        public bool Done { get; set; }
        public string? Color { get; set; }              
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
