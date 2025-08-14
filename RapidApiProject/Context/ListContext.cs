using Microsoft.EntityFrameworkCore;
using RapidApiProject.Entities;

namespace RapidApiProject.Context
{
    public class ListContext : DbContext
    {
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseSqlServer("Server=MULUSOY\\SQLEXPRESS01;initial Catalog=ListMovieSeriesGameDB;integrated security=true;TrustServerCertificate=True");
        }
        public DbSet<Series> Series { get; set; }
        public DbSet<Movie> Movies { get; set; }
        public DbSet<Game> Games { get; set; }
        public DbSet<PlannerGoal> PlannerGoals { get; set; }
        public DbSet<PlannerTask> PlannerTasks { get; set; }
        public DbSet<Exercise> Exercises { get; set; }
        public DbSet<ExerciseCategory> ExerciseCategories { get; set; }
        public DbSet<TrainingProgram> TrainingPrograms { get; set; }
        public DbSet<TrainingItem> TrainingItems { get; set; }
        public DbSet<TrainingDay> TrainingDays { get; set; }
    }
}
