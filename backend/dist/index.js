"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = require("./routes/auth.routes");
const wallet_routes_1 = require("./routes/wallet.routes");
const transaction_routes_1 = require("./routes/transaction.routes");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
//initialize database
//Routes
app.use("/api/auth", auth_routes_1.authRouter);
app.use("/api/wallet", wallet_routes_1.walletRouter);
app.use("/api/transaction", transaction_routes_1.transactionRouter);
app.listen(PORT, () => {
    console.log("server running .....");
});
