namespace RapidApiProject.Models
{
    public class PlannerItemVM
    {
        public int ItemId { get; set; }
        public int ExerciseId { get; set; }
        public string ExerciseName { get; set; } = "";
        public string Equipment { get; set; } = "";
        public string Mechanics { get; set; } = "";
        public string Difficulty { get; set; } = "";
        public int? Sets { get; set; }
        public string? Reps { get; set; }
        public int? RestSec { get; set; }
    }
}
