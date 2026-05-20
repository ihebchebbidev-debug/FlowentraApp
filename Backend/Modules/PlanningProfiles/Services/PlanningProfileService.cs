using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.Modules.PlanningProfiles.DTOs;
using MyApi.Modules.PlanningProfiles.Models;

namespace MyApi.Modules.PlanningProfiles.Services
{
    public class PlanningProfileService : IPlanningProfileService
    {
        private readonly ApplicationDbContext _db;
        public PlanningProfileService(ApplicationDbContext db) { _db = db; }

        public async Task<List<PlanningProfileDto>> ListAsync(string currentUserId)
        {
            var profiles = await _db.Set<PlanningProfile>()
                .Where(p => p.DeletedAt == null && (p.OwnerUserId == currentUserId || p.IsShared))
                .OrderByDescending(p => p.UpdatedAt)
                .ToListAsync();
            return profiles.Select(ToDto).ToList();
        }

        public async Task<PlanningProfileDto?> GetByIdAsync(int id, string currentUserId)
        {
            var p = await _db.Set<PlanningProfile>().FirstOrDefaultAsync(x => x.Id == id && x.DeletedAt == null);
            if (p == null) return null;
            if (p.OwnerUserId != currentUserId && !p.IsShared) return null;
            return ToDto(p);
        }

        public async Task<PlanningProfileDto> CreateAsync(CreatePlanningProfileDto dto, string currentUserId)
        {
            var p = new PlanningProfile
            {
                OwnerUserId = currentUserId,
                Name = dto.Name,
                Description = dto.Description,
                Color = dto.Color,
                Icon = dto.Icon,
                IsShared = dto.IsShared,
                VisibleUserIdsJson = JsonSerializer.Serialize(dto.VisibleUserIds ?? new List<string>()),
                RequiredSkillIdsJson = dto.RequiredSkillIds != null ? JsonSerializer.Serialize(dto.RequiredSkillIds) : null,
                SettingsJson = JsonSerializer.Serialize(dto.Settings ?? new { }),
                CreatedBy = currentUserId,
                UpdatedBy = currentUserId,
            };
            _db.Set<PlanningProfile>().Add(p);
            await _db.SaveChangesAsync();
            return ToDto(p);
        }

        public async Task<PlanningProfileDto> UpdateAsync(int id, UpdatePlanningProfileDto dto, string currentUserId)
        {
            var p = await _db.Set<PlanningProfile>().FirstOrDefaultAsync(x => x.Id == id && x.DeletedAt == null)
                ?? throw new InvalidOperationException("Profile not found");
            if (p.OwnerUserId != currentUserId) throw new UnauthorizedAccessException("Not owner");

            if (dto.Name != null) p.Name = dto.Name;
            if (dto.Description != null) p.Description = dto.Description;
            if (dto.Color != null) p.Color = dto.Color;
            if (dto.Icon != null) p.Icon = dto.Icon;
            if (dto.IsShared.HasValue) p.IsShared = dto.IsShared.Value;
            if (dto.VisibleUserIds != null) p.VisibleUserIdsJson = JsonSerializer.Serialize(dto.VisibleUserIds);
            if (dto.RequiredSkillIds != null) p.RequiredSkillIdsJson = JsonSerializer.Serialize(dto.RequiredSkillIds);
            if (dto.Settings != null) p.SettingsJson = JsonSerializer.Serialize(dto.Settings);
            p.UpdatedAt = DateTime.UtcNow;
            p.UpdatedBy = currentUserId;
            await _db.SaveChangesAsync();
            return ToDto(p);
        }

        public async Task DeleteAsync(int id, string currentUserId)
        {
            var p = await _db.Set<PlanningProfile>().FirstOrDefaultAsync(x => x.Id == id && x.DeletedAt == null)
                ?? throw new InvalidOperationException("Profile not found");
            if (p.OwnerUserId != currentUserId) throw new UnauthorizedAccessException("Not owner");
            p.DeletedAt = DateTime.UtcNow;
            p.DeletedBy = currentUserId;
            await _db.SaveChangesAsync();
        }

        public async Task<PlanningProfileDto?> GetActiveAsync(string currentUserId)
        {
            var active = await _db.Set<UserActivePlanningProfile>()
                .FirstOrDefaultAsync(x => x.UserId == currentUserId);
            if (active == null)
            {
                var any = await _db.Set<PlanningProfile>()
                    .Where(p => p.DeletedAt == null && p.OwnerUserId == currentUserId)
                    .OrderBy(p => p.Id)
                    .FirstOrDefaultAsync();
                return any != null ? ToDto(any) : null;
            }
            var p = await _db.Set<PlanningProfile>().FirstOrDefaultAsync(x => x.Id == active.ProfileId && x.DeletedAt == null);
            return p != null ? ToDto(p) : null;
        }

        public async Task SetActiveAsync(int profileId, string currentUserId)
        {
            var p = await _db.Set<PlanningProfile>().FirstOrDefaultAsync(x => x.Id == profileId && x.DeletedAt == null)
                ?? throw new InvalidOperationException("Profile not found");
            if (p.OwnerUserId != currentUserId && !p.IsShared) throw new UnauthorizedAccessException();

            var existing = await _db.Set<UserActivePlanningProfile>().FirstOrDefaultAsync(x => x.UserId == currentUserId);
            if (existing == null)
            {
                _db.Set<UserActivePlanningProfile>().Add(new UserActivePlanningProfile
                {
                    UserId = currentUserId,
                    ProfileId = profileId,
                    UpdatedAt = DateTime.UtcNow,
                });
            }
            else
            {
                existing.ProfileId = profileId;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            await _db.SaveChangesAsync();
        }

        private static PlanningProfileDto ToDto(PlanningProfile p)
        {
            List<string> visible;
            try { visible = JsonSerializer.Deserialize<List<string>>(p.VisibleUserIdsJson) ?? new(); }
            catch { visible = new(); }

            List<string>? skills = null;
            if (!string.IsNullOrEmpty(p.RequiredSkillIdsJson))
            {
                try { skills = JsonSerializer.Deserialize<List<string>>(p.RequiredSkillIdsJson); }
                catch { skills = null; }
            }

            object settings;
            try { settings = JsonSerializer.Deserialize<JsonElement>(p.SettingsJson); }
            catch { settings = new { }; }

            return new PlanningProfileDto
            {
                Id = p.Id,
                TenantId = p.TenantId,
                OwnerUserId = p.OwnerUserId,
                Name = p.Name,
                Description = p.Description,
                Color = p.Color,
                Icon = p.Icon,
                IsShared = p.IsShared,
                VisibleUserIds = visible,
                RequiredSkillIds = skills,
                Settings = settings,
                CreatedAt = p.CreatedAt.ToString("o"),
                UpdatedAt = p.UpdatedAt.ToString("o"),
            };
        }
    }
}
