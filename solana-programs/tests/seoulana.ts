import * as anchor from "@coral-xyz/anchor";
import { Uxaa } from "../target/types/uxaa";
import { assert } from "chai";

describe("uxaa", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Uxaa as anchor.Program<Uxaa>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
