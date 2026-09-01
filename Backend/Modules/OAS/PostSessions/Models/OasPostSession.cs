using MyApi.Modules.OAS.Common.Data;

namespace MyApi.Modules.OAS.PostSessions.Models;

public class OasPostSession : OasEntityBase
{
    public Guid ClientEventId { get; set; }
    public Guid PostId { get; set; }
    public Guid UserId { get; set; }
    public Guid? AssignmentId { get; set; }
    public Guid? ProductionOrderId { get; set; }
    public Guid? ShiftTemplateId { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? EndedAt { get; set; }
    public string StartedVia { get; set; } = "qr"; // qr|manual|biometric|pin

    /// <summary>
    /// Why the session ended — null while it is still open (EF-M3-14).
    /// manual    : an operator/supervisor closed it via POST /close
    /// relay     : superseded by a force-relay open on the same post/user
    /// shift_end : auto-closed by the watchdog past shift end + grace
    /// stale     : auto-closed by the watchdog's absolute age cap
    /// </summary>
    public string? ClosedReason { get; set; }

    /// <summary>Who closed it (null for watchdog closures — the system has no user id).</summary>
    public Guid? ClosedBy { get; set; }

    /// <summary>On a relayed (handed-over) session, the operator who held it before the handover.</summary>
    public Guid? RelayedFromUserId { get; set; }
    public DateTimeOffset ReceivedAt { get; set; } = DateTimeOffset.UtcNow;
}
