using RapidApiProject.Context; // Bu sat�r� ekledi�inizden emin olun

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

// --- VER�TABANI BA�LANTI AYARI BURADAN KALDIRILDI ---
// Sadece ListContext'i ba��ml�l�k enjeksiyonuna ekleyin, yap�land�rmay� de�il.
builder.Services.AddScoped<ListContext>(); // AddDbContext yerine AddScoped kullan�n
// --- BURAYA KADAR DE���T�R�LD� ---

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Default}/{action=Dashboard}/{id?}");

app.Run();