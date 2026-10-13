# Wallet RPC Verification Document

According to `skills.md` Phase 2, this document tracks the expected JSON-RPC methods against Zallet NU7 testnet.

## Methods to VERIFY against Zallet:

1. **`getinfo` / `getblockchaininfo`**
   - Need to extract `synced`, `blocks`, and `chain` (network).

2. **`z_getaddressforaccount`**
   - Arguments expected: `accountId`, `["orchard"]`, `diversifierIndex`
   - Need to verify if `diversifierIndex` is supported as an argument in Zallet's implementation.

3. **`z_listunspent` or `z_listreceivedbyaddress`**
   - Need to verify how to extract incoming notes, including their pool (`ironwood`, `orchard`), memo, and receiving address. 
   - Ensure change outputs can be filtered out.

4. **`z_getbalanceforaccount`**
   - Verify the return shape (is it an object with `total` in ZEC?).

5. **`z_sendmany` and ZIP-317 proposals**
   - Verify if Zallet provides a way to propose a transaction fee before executing it.

6. **`z_validateaddress`**
   - Check if it correctly identifies `u1` and `utest1` Unified Addresses.

7. **`z_getoperationresult`**
   - Standard operation polling.

**Status:** Awaiting live NU7 node to run contract tests. Currently using `mockBackend.js` in development.
