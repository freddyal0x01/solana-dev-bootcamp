import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TokenLottery } from "../target/types/token_lottery";

describe("Lottery", () => {
  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet as anchor.Wallet;
  anchor.setProvider(provider);

  const program = anchor.workspace.TokenLottery as Program<TokenLottery>;

  async function buyTicket() {
    const buyTicketIx = await program.methods
      .buyTicket()
      .accounts({ tokenProgram: TOKEN_PROGRAM_ID })
      .instruction();

    const computeIx = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
      units: 300_000,
    });

    const priorityIx = anchor.web3.ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 1,
    });

    const blockHashWithContext = await provider.connection.getLatestBlockhash();

    const buyTicketTx = new anchor.web3.Transaction({
      feePayer: provider.wallet.publicKey,
      blockhash: blockHashWithContext.blockhash,
      lastValidBlockHeight: blockHashWithContext.lastValidBlockHeight,
    })
      .add(buyTicketIx)
      .add(computeIx)
      .add(priorityIx);

    const signature = await anchor.web3.sendAndConfirmTransaction(
      provider.connection,
      buyTicketTx,
      [wallet.payer],
      { skipPreflight: true },
    );

    console.log("Buy Ticket Signature: ", signature);
  }

  it("should test token lottery", async () => {
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
      initLotteryTx,
      [wallet.payer],
      { skipPreflight: true },
    );

    console.log("Init Lottery Signature: ", initLotterySignature);

    await buyTicket();
  });
});
