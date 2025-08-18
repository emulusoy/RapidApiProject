namespace RapidApiProject.Models
{
    public class PlanDetailVM
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public string? CoverImage { get; set; }
        public int TotalItems { get; set; }
        public List<PlanDetailItemVM> Items { get; set; } = new();
    }

    public class PlanDetailItemVM
    {
        public int Order { get; set; }
        public int ExerciseId { get; set; }
        public string Name { get; set; } = "";
        public string? Image { get; set; }
        public string? Category { get; set; }
        public int? Sets { get; set; }
        public string? Reps { get; set; }
        public int? RestSec { get; set; }
    }
}
