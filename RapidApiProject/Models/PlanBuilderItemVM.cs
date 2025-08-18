namespace RapidApiProject.Models
{
    public class PlanBuilderItemVM
    {
        public int ExerciseId { get; set; }
        public string Name { get; set; } = "";
        public string? Image { get; set; }
        public string? Category { get; set; }
        public string? Equipment { get; set; }
        public string? Mechanics { get; set; }
        public string? Difficulty { get; set; }
        public int? Sets { get; set; }
        public string? Reps { get; set; }
        public int? RestSec { get; set; }
        public int Sort { get; set; }
    }
}
