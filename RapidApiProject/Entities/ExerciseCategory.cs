using RapidApiProject.Models;

namespace RapidApiProject.Entities
{
    public class ExerciseCategory
    {
        public int Id { get; set; }
        public string Slug { get; set; } = "";  // "chest", "back"...
        public string Name { get; set; } = "";  // "Göğüs"...
        public string? Icon { get; set; }       // fa-dumbbell vb. (ops.)
        public ICollection<Exercise> Exercises { get; set; } = new List<Exercise>();
    }
}
