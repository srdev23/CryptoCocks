// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

library CryptoCocksLib {

    function getCid(uint id) external pure returns (string memory cid) {
        string memory batch;

        if (id <= 2000) {
            batch = "b1";
        } else if (id <= 4000) {
            batch = "b2";
        } else if (id <= 6000) {
            batch = "b3";
        } else if (id <= 8000) {
            batch = "b4";
        } else {
            batch = "b5";
        }

        return string(abi.encodePacked("ipfs://", batch, "/"));
    }
}
