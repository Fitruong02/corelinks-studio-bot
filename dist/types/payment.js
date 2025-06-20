"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundStatus = exports.PaymentStatus = exports.PaymentMethod = void 0;
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["BANKING"] = "BANKING";
    PaymentMethod["MOMO"] = "MOMO";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["EXPIRED"] = "expired";
    PaymentStatus["CANCELLED"] = "cancelled";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var RefundStatus;
(function (RefundStatus) {
    RefundStatus["REQUESTED"] = "requested";
    RefundStatus["APPROVED"] = "approved";
    RefundStatus["DENIED"] = "denied";
    RefundStatus["PROCESSED"] = "processed";
})(RefundStatus || (exports.RefundStatus = RefundStatus = {}));
//# sourceMappingURL=payment.js.map