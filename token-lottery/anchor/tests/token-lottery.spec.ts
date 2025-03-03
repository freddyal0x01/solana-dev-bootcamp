import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Lottery } from "../target/types/lottery";

describe("Lottery", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const wallet = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.Lottery as Program<Lottery>;

  it("should init", async () => {
    const initConfigIx = await program.methods
      .initializeConfig(
        new anchor.BN(0),
        new anchor.BN(1840961743),
        new anchor.BN(10000),
      )
      .instruction();

    const blockHashWithContext = await provider.connection.getLatestBlockhash();

    const tx = new anchor.web3.Transaction({
      feePayer: provider.wallet.publicKey,
      blockhash: blockHashWithContext.blockhash,
      lastValidBlockHeight: blockHashWithContext.lastValidBlockHeight,
    }).add(initConfigIx);

    const signature = await anchor.web3.sendAndConfirmTransaction(
      provider.connection,
      tx,
      [wallet.payer],
      { skipPreflight: true },
    );

    console.log("Transaction Signature: ", signature);

    const initLotteryIx = await program.methods
      .initializeLottery()
      .accounts({
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    const initLotteryTx = new anchor.web3.Transaction({
      feePayer: provider.wallet.publicKey,
      blockhash: blockHashWithContext.blockhash,
      lastValidBlockHeight: blockHashWithContext.lastValidBlockHeight,
    }).add(initLotteryIx);

    const initLotterySignature = await anchor.web3.sendAndConfirmTransaction(
      provider.connection,
      tx,
      [wallet.payer],
      { skipPreflight: true },
    );

    console.log("Init Lottery Signature: ", initLotterySignature);
  });
});
