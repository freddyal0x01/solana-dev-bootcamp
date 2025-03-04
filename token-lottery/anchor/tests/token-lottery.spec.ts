import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as sb from "@switchboard-xyz/on-demand";
import SwitchboardIDL from "../switchboard.json";
import { TokenLottery } from "../target/types/token_lottery";

describe("Lottery", () => {
  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet as anchor.Wallet;
  anchor.setProvider(provider);

  const program = anchor.workspace.TokenLottery as Program<TokenLottery>;

  const switchboardProgram = new anchor.Program(
    SwitchboardIDL as anchor.Idl,
    provider,
  );
  const rngKp = anchor.web3.Keypair.generate();

  // beforeAll(async () => {
  //   const switchboardIDL = (await anchor.Program.fetchIdl(
  //     {
  //       connection: new anchor.web3.Connection(
  //         "https://api.mainnet-beta.solana.com",
  //       ),
  //     },
  //   )) as anchor.Idl;

  //   fs.writeFile(
  //     "switchboard.json",
  //     JSON.stringify(switchboardIDL),
  //     function (err) {
  //       if (err) {
  //         console.log(err);
  //       }
  //     },
  //   );

  //   switchboardProgram = new anchor.Program(switchboardIDL, provider);
  // });

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
    await buyTicket();
    await buyTicket();
    await buyTicket();
    await buyTicket();
    await buyTicket();
    await buyTicket();

    const queue = new anchor.web3.PublicKey(
      "A43DyUGA7s8eXPxqEjJY6EBu1KKbNgfxF8h17VAHn13w",
    );

    const queueAccount = new sb.Queue(switchboardProgram, queue);

    try {
      await queueAccount.loadData();
    } catch (err) {
      console.log("Error", err);
      process.exit(1);
    }

    const [randomness, createRandomnessIx] = await sb.Randomness.create(
      switchboardProgram,
      rngKp,
      queue,
    );

    const createRandomnessTx = await sb.asV0Tx({
      connection: provider.connection,
      ixs: [createRandomnessIx],
      payer: wallet.publicKey,
      signers: [wallet.payer, rngKp],
    });

    const createRandomnessSignature = await provider.connection.sendTransaction(
      createRandomnessTx,
    );

    console.log("Create Randomness Signature: ", createRandomnessSignature);
  });
});
