import {
    passetHub,
    XcmV3MultiassetFungibility,
    XcmV3WeightLimit,
    XcmV5AssetFilter,
    XcmV5Instruction,
    XcmV5Junction,
    XcmV5Junctions,
    XcmV5WildAsset,
    XcmVersionedXcm,
} from "@polkadot-api/descriptors" // npm run postinstall
import { Binary, FixedSizeBinary, getTypedCodecs, Enum } from "polkadot-api"

import { PAS_UNITS, PAS_CENTS, SOME_POLKADOT_ACCOUNT, PASEO_HUB_CHAIN_ID } from "./constants"

// Sends PAS to a non-system parachain.
//
// They are routed via AssetHub.
export async function getTransferToChainId(chainId: number) {
    const xcm = XcmVersionedXcm.V5([
        XcmV5Instruction.WithdrawAsset([
            {
                id: { parents: 1, interior: XcmV5Junctions.Here() },
                fun: XcmV3MultiassetFungibility.Fungible(10n * PAS_UNITS),
            },
        ]),
        XcmV5Instruction.PayFees({
            asset: {
                id: { parents: 1, interior: XcmV5Junctions.Here() },
                fun: XcmV3MultiassetFungibility.Fungible(1n * PAS_UNITS),
            },
        }),
        XcmV5Instruction.InitiateTransfer({
            destination: {
                parents: 1,
                interior: XcmV5Junctions.X1(XcmV5Junction.Parachain(PASEO_HUB_CHAIN_ID)),
            },
            remote_fees: Enum(
                "Teleport",
                XcmV5AssetFilter.Definite([
                    {
                        id: { parents: 1, interior: XcmV5Junctions.Here() },
                        fun: XcmV3MultiassetFungibility.Fungible(1n * PAS_UNITS),
                    },
                ]),
            ),
            preserve_origin: false,
            remote_xcm: [
                XcmV5Instruction.DepositReserveAsset({
                    assets: XcmV5AssetFilter.Wild(XcmV5WildAsset.AllCounted(1)),
                    dest: {
                        parents: 1,
                        interior: XcmV5Junctions.X1(XcmV5Junction.Parachain(chainId)),
                    },
                    xcm: [
                        XcmV5Instruction.BuyExecution({
                            fees: {
                                id: { parents: 1, interior: XcmV5Junctions.Here() },
                                fun: XcmV3MultiassetFungibility.Fungible(10n * PAS_CENTS),
                            },
                            weight_limit: XcmV3WeightLimit.Unlimited(),
                        }),
                        XcmV5Instruction.DepositAsset({
                            assets: XcmV5AssetFilter.Wild(XcmV5WildAsset.AllCounted(1)),
                            beneficiary: {
                                parents: 0,
                                interior: XcmV5Junctions.X1(
                                    XcmV5Junction.AccountId32({
                                        network: undefined,
                                        id: FixedSizeBinary.fromAccountId32(SOME_POLKADOT_ACCOUNT),
                                    }),
                                ),
                            },
                        }),
                    ],
                }),
            ],
            assets: [
                Enum("Teleport", XcmV5AssetFilter.Wild(XcmV5WildAsset.AllCounted(1))), // We send everything.
            ],
        }),
    ])
    const codecs = await getTypedCodecs(passetHub)
    const xcmEncoded = codecs.apis.XcmPaymentApi.query_xcm_weight.args.enc([xcm])
    const xcmHex = Binary.fromBytes(xcmEncoded).asHex()
    return xcmHex
}
