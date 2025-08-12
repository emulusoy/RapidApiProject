namespace RapidApiProject.Models
{
    public class ExerciseDetailVM
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string CategoryName { get; set; } = "";
        public string Mechanics { get; set; } = "";
        public string Difficulty { get; set; } = "";
        public string Equipment { get; set; } = "";
        public string? Image { get; set; }
        public string? VideoUrl { get; set; }
        public string? Notes { get; set; }
        public string? PrimaryMuscles { get; set; }
        public string? SecondaryMuscles { get; set; }
        public bool IsFavorite { get; set; }

        public IReadOnlyList<ExerciseItemVM> Related { get; set; } = new List<ExerciseItemVM>();
    }
}
