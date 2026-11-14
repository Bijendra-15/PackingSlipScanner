using System.Text.Json.Serialization;
using backend.Data;
using backend.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = null;
    o.JsonSerializerOptions.NumberHandling = JsonNumberHandling.AllowReadingFromString;
});
builder.Services.AddOpenApi();
builder.Services.AddSingleton<IPackSlipRepository, InMemoryPackSlipRepository>();
builder.Services.AddSingleton<IUserRepository, InMemoryUserRepository>();
builder.Services.AddSingleton<backend.Services.SlUserService>();
builder.Services.AddSingleton<backend.Services.SlConfigService>();
builder.Services.AddSingleton<backend.Services.SlAppLoggingService>();

// CORS for the React frontend (Vite dev server / LAN access / built app)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.MapControllers();

// Seed demo data so the app is usable out of the box.
using (var scope = app.Services.CreateScope())
{
    var repo = scope.ServiceProvider.GetRequiredService<IPackSlipRepository>();
    SeedData(repo);
}

app.Run();

static void SeedData(IPackSlipRepository repo)
{
    var slips = new[]
    {
        new PackSlip
        {
            SlipNumber = "PS-2026-0001",
            CustomerName = "Acme Corporation",
            OrderNumber = "ORD-1001",
            Status = "shipped",
            Items =
            [
                new PackSlipItem { Sku = "SKU-A100", Name = "Widget A", Quantity = 10, Location = "Aisle 1, Shelf B" },
                new PackSlipItem { Sku = "SKU-B200", Name = "Gadget B", Quantity = 5, Location = "Aisle 2, Shelf A" }
            ],
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        },
        new PackSlip
        {
            SlipNumber = "PS-2026-0002",
            CustomerName = "Globex Industries",
            OrderNumber = "ORD-1002",
            Status = "packed",
            Items =
            [
                new PackSlipItem { Sku = "SKU-C300", Name = "Doohickey C", Quantity = 20, Location = "Aisle 3, Shelf C" }
            ],
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow.AddHours(-5)
        },
        new PackSlip
        {
            SlipNumber = "PS-2026-0003",
            CustomerName = "Initech",
            OrderNumber = "ORD-1003",
            Status = "pending",
            Items =
            [
                new PackSlipItem { Sku = "SKU-D400", Name = "Thingamajig D", Quantity = 2, Location = "Aisle 1, Shelf A" },
                new PackSlipItem { Sku = "SKU-E500", Name = "Whatchamacallit E", Quantity = 1, Location = "Aisle 4, Shelf D" }
            ],
            CreatedAt = DateTime.UtcNow.AddHours(-3),
            UpdatedAt = DateTime.UtcNow.AddHours(-3)
        }
    };

    foreach (var slip in slips)
    {
        _ = repo.CreateAsync(slip, CancellationToken.None).GetAwaiter().GetResult();
    }
}
