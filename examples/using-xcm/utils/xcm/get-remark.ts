import {
    passetHub,
    XcmV2OriginKind,
    XcmV5Instruction,
    XcmVersionedXcm,
} from "@polkadot-api/descriptors" // npm run postinstall
import { Binary, createClient, getTypedCodecs } from "polkadot-api"
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat"
import { getWsProvider } from "polkadot-api/ws-provider/web"

export async function getRemark(remark: string): Promise<string> {
    const codecs = await getTypedCodecs(passetHub)

    const PAssetHubClient = createClient(
        withPolkadotSdkCompat(getWsProvider("https://testnet-passet-hub.polkadot.io")),
    )
    const PAssetHubApi = PAssetHubClient.getTypedApi(passetHub)

    const remarkWithEventEncoded = await PAssetHubApi.tx.System.remark_with_event({
        remark: Binary.fromText(remark),
    }).getEncodedData()

    const xcm = XcmVersionedXcm.V5([
        XcmV5Instruction.Transact({
            origin_kind: XcmV2OriginKind.Native(),
            call: remarkWithEventEncoded,
        }),
    ])

    const xcmEncoded = codecs.apis.XcmPaymentApi.query_xcm_weight.args.enc([xcm])
    const xcmHex = Binary.fromBytes(xcmEncoded).asHex()
    return xcmHex
}
