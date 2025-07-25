using RapidApiProject.Context; // Bu satırı eklediğinizden emin olun

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

// --- VERİTABANI BAĞLANTI AYARI BURADAN KALDIRILDI ---
// Sadece ListContext'i bağımlılık enjeksiyonuna ekleyin, yapılandırmayı değil.
builder.Services.AddScoped<ListContext>(); // AddDbContext yerine AddScoped kullanın
// --- BURAYA KADAR DEĞİŞTİRİLDİ ---

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