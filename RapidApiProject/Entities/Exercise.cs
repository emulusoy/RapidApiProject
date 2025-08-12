namespace RapidApiProject.Entities
{
    public class Exercise
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public int CategoryId { get; set; }
        public ExerciseCategory Category { get; set; } = default!;

        // basit meta
        public string Mechanics { get; set; } = "Compound"; // Compound / Isolation
        public string Difficulty { get; set; } = "Beginner"; // Beginner/Intermediate/Advanced
        public string Equipment { get; set; } = "Bodyweight"; // Barbell/Dumbbell/Cable/Bodyweight/Machine...

        public string? Image { get; set; }    // küçük görsel
        public string? VideoUrl { get; set; } // youtube vb. (ops.)
        public string? Notes { get; set; }
        public string? PrimaryMuscles { get; set; }   // serbest metin
        public string? SecondaryMuscles { get; set; } // serbest metin
        public bool IsFavorite { get; set; }
    }
}
