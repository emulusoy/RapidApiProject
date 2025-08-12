namespace RapidApiProject.Models
{
    public class ExerciseItemVM
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string CategoryName { get; set; } = "";
        public string Mechanics { get; set; } = "";
        public string Difficulty { get; set; } = "";
        public string Equipment { get; set; } = "";
        public string? Image { get; set; }
    }
}
