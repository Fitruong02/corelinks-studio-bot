"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketPriority = exports.TicketStatus = exports.ServiceType = void 0;
var ServiceType;
(function (ServiceType) {
    ServiceType["GAME"] = "Game";
    ServiceType["DISCORD"] = "Discord";
    ServiceType["MINECRAFT"] = "Minecraft";
})(ServiceType || (exports.ServiceType = ServiceType = {}));
var TicketStatus;
(function (TicketStatus) {
    TicketStatus["PENDING"] = "pending";
    TicketStatus["APPROVED"] = "approved";
    TicketStatus["ACTIVE"] = "active";
    TicketStatus["WAITING"] = "waiting";
    TicketStatus["CLOSED"] = "closed";
})(TicketStatus || (exports.TicketStatus = TicketStatus = {}));
var TicketPriority;
(function (TicketPriority) {
    TicketPriority["LOW"] = "low";
    TicketPriority["MEDIUM"] = "medium";
    TicketPriority["HIGH"] = "high";
})(TicketPriority || (exports.TicketPriority = TicketPriority = {}));
//# sourceMappingURL=ticket.js.map