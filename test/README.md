# Test results: Remittance

```
truffle(develop)> test test/remittance.test.js
Using network 'develop'.

Compiling your contracts...
===========================
> Everything is up to date, there is nothing to compile.

  network: develop


  Contract: Remittance

    There are five accounts available:
	#0: 0x546546CE0DD629c1cF8632cC3cBB51EB700e9AA4
	#1: 0xD0862801bCa8FFB28Fc2668a19470538Cd1898ca
	#2: 0xD6cafe0095B00Df759e2DaF9E33Fe9D1a36F581D
	#3: 0x97aBb5A10c6A11d546D14550bdc4ae42Ddf74a58
	#4: 0x6eF28e348e9C486BA5E3056e07fCD07DC2f879A4


    constructor()
      ✓ should not be possible to start Remittance as 'destroyed' (4583ms)
      ✓ should not be possible to set 'maxDurationBlocks' to 0 (910ms)
      ✓ should not be possible to set 'defaultContractFeePercentage' below 0 or higher than 50 (599ms)
      ✓ should not be possible to send value (626ms)
      ✓ should be possible to start Remittance as 'paused' (738ms)
      ✓ should be possible to start Remittance as 'running' (435ms)
      ✓ should be possible to start Remittance with maxDurationBlocks: 1000, contractFeePercentage: 10 (761ms)
    function createHashedPassword()
      ✓ should not be possible to create a hashed password without providing 'exchange' (237ms)
      ✓ should not be possible to create a hashed password when 'clearPassword' is empty (177ms)
      ✓ hashed password should match with soliditySha3 (703ms)
    function changeMaxDurationBlocks()
      ✓ should not be possible to set a new value for 'maxDurationBlocks' by an attacker (361ms)
      ✓ should not be possible to set the value for 'maxDurationBlocks' to 0 (390ms)
      ✓ should be possible to set a new value for 'maxDurationBlocks' by owner (797ms)
    function changeContractFeePercentage()
      ✓ should not be possible to set a new value for 'contractFeePercentage' by an attacker (492ms)
      ✓ should not be possible to change the value for 'contractFeePercentage' lower than 0 (lower bound) and above 50 (upper bound) (499ms)
      ✓ should be possible to set a new value for 'contractFeePercentage' by owner (921ms)
    function depositFunds()
      ✓ should not be possible to deposit funds if contract is paused (842ms)
      ✓ should not be possible to deposit without value (383ms)
      ✓ should not be possible to deposit without providing 'hashedPassword' (298ms)
      ✓ should not be possible to deposit with non-applicable 'durationBlocks' (869ms)
      ✓ should be possible to deposit funds (774ms)
      ✓ should not be possible to deposit with the same 'hashedPassword' (319ms)
      ✓ should still be possible to deposit small amounts (and are not eaten up by fees) (619ms)
    function withdrawFunds()
      ✓ should not be possible to withdraw funds if contract is paused (316ms)
      ✓ should not be payable (95ms)
      ✓ should not be possible to withdraw without providing 'clearPassword' (176ms)
      ✓ should not be possible to withdraw with known 'clearPassword' by an attacker (190ms)
      ✓ should be possible to withdraw funds (558ms)
      ✓ should not be possible to withdraw funds twice (161ms)
      ✓ should not be possible to deposit with the same 'hashedPassword' after withdraw (315ms)
    function reclaimFunds()
      ✓ should not be possible to reclaim funds if contract is paused (398ms)
      ✓ should not be payable (117ms)
      ✓ should only be 'sender'/'origin' who is allowed to reclaim funds (245ms)
      ✓ should not be possible to reclaim funds if deadline is not expired (234ms)
      ✓ should be possible to reclaim funds by 'sender'/'origin' (1075ms)
      ✓ should not be possible to reclaim funds twice (422ms)
      ✓ should not be possible to deposit with the same 'hashedPassword' after reclaim (536ms)
    function withdrawFees()
      ✓ should not be payable (213ms)
      ✓ should not be possible to withdraw fees by an attacker (206ms)
      ✓ should not withdraw when no fees were collected (514ms)
      ✓ should be possible to withdraw fees (572ms)
      ✓ should not be possible to withdraw fees twice (183ms)
    overwritten function renounceOwnership()
      ✓ should not be payable (196ms)
      ✓ should still not be possible to renounce ownership by an attacker (326ms)
      ✓ should not be possible to renounce ownership before 'contractFeePercentage' was set to 0 (155ms)
      ✓ should not be possible to renounce ownership when collected fees were not withdrawn (659ms)
      ✓ should be possible to renounce ownership with all preconditions fulfilled (747ms)


  47 passing (56s)
```