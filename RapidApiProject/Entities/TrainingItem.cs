using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace RapidApiProject.Entities
{
    public class TrainingItem
    {
        [Key] public int Id { get; set; }

        [ForeignKey(nameof(Day))]
        public int DayId { get; set; }
        public TrainingDay Day { get; set; } = default!;

        // Var olan Exercises tablosuna FK
        [ForeignKey(nameof(Exercise))]
        public int ExerciseId { get; set; }
        public Exercise Exercise { get; set; } = default!; // mevcut modelin

        public int SortOrder { get; set; } = 0;

        public int? Sets { get; set; }

        [MaxLength(20)]
        public string? Reps { get; set; }  // "8-10" gibi

        public int? RestSec { get; set; }

        public string? Notes { get; set; }
    }
}
