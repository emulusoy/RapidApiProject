namespace RapidApiProject.Entities
{
    public class PlannerGoal
    {
        public int Id { get; set; }                     
        public string Title { get; set; } = "";
        public string Scope { get; set; } = "month";  
        public bool Completed { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
