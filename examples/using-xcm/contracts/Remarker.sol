// SPDX-License-Identifier: MIT

import "./interfaces/IXCM.sol";

pragma solidity ^0.8.20;

contract Remarker {
    IXcm xcmPrecompile = IXcm(XCM_PRECOMPILE_ADDRESS);

    bytes private s_message;

    constructor(bytes memory message) {
        s_message = message;
    }

    function remark() public {
        // Construct weight struct
        IXcm.Weight memory weight = xcmPrecompile.weighMessage(s_message);

        xcmPrecompile.execute(s_message, weight);
    }

    function setMessage(bytes memory message) public {
        s_message = message;
    }

    function getMessage() public view returns (bytes memory) {
        return s_message;
    }
}
