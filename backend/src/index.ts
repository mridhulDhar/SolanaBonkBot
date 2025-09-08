import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth.routes";
import { walletRouter } from "./routes/wallet.routes";
import { transactionRouter } from "./routes/transaction.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

//initialize database

//Routes
app.use("/api/auth", authRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/transaction", transactionRouter);

app.listen(PORT, () => {
    console.log("server running .....")
});