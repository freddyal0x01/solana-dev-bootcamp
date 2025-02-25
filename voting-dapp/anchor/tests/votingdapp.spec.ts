import { BN, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { BankrunProvider, startAnchor } from "anchor-bankrun";
import { Votingdapp } from "../target/types/votingdapp";

const IDL = require("../target/idl/votingdapp.json");

const votingAddress = new PublicKey(
  "coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF",
);

describe("votingdapp", () => {
  let context;
  let provider;
  let votingProgram: Program<Votingdapp>;

  beforeAll(async () => {
    context = await startAnchor(
      "",
      [{ name: "votingdapp", programId: votingAddress }],
      [],
    );

    provider = new BankrunProvider(context);

    votingProgram = new Program<Votingdapp>(IDL, provider);
  });

  it("initializes a Poll", async () => {
    context = await startAnchor(
      "",
      [{ name: "votingdapp", programId: votingAddress }],
      [],
    );

    provider = new BankrunProvider(context);

    votingProgram = new Program<Votingdapp>(IDL, provider);

    await votingProgram.methods
      .initializePoll(
        new BN(1),
        "What is your favorite type of peanut butter?",
        new BN(0),
        new BN(1840453107),
      )
      .rpc();

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new BN(1).toArrayLike(Buffer, "le", 8)],
      votingAddress,
    );

    const poll = await votingProgram.account.poll.fetch(pollAddress);

    console.log(poll);

    expect(poll.pollId.toNumber()).toEqual(1);
    expect(poll.description).toEqual(
      "What is your favorite type of peanut butter?",
    );
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());
  });

  it("initiatlizes a candidate", async () => {
    await votingProgram.methods.initializeCandidate("Smooth", new BN(1)).rpc();
    await votingProgram.methods.initializeCandidate("Crunchy", new BN(1)).rpc();

    const [crunchyAddress] = PublicKey.findProgramAddressSync(
      [new BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Crunchy")],
      votingAddress,
    );

    const crunchyCandidate = await votingProgram.account.candidate.fetch(
      crunchyAddress,
    );

    console.log(crunchyCandidate);

    expect(crunchyCandidate.candidateVotes.toNumber()).toEqual(0);

    const [smoothAddress] = PublicKey.findProgramAddressSync(
      [new BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Smooth")],
      votingAddress,
    );

    const smoothCandidate = await votingProgram.account.candidate.fetch(
      smoothAddress,
    );

    console.log(smoothCandidate);

    expect(smoothCandidate.candidateVotes.toNumber()).toEqual(0);
  });

  it("votes", async () => {
    await votingProgram.methods.vote("Smooth", new BN(1)).rpc();

    const [smoothAddress] = PublicKey.findProgramAddressSync(
      [new BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Smooth")],
      votingAddress,
    );

    const smoothCandidate = await votingProgram.account.candidate.fetch(
      smoothAddress,
    );

    console.log(smoothCandidate);

    expect(smoothCandidate.candidateVotes.toNumber()).toEqual(1);
  });
});
