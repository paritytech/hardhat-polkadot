import {
    passetHub,
    XcmV2OriginKind,
    XcmV5Instruction,
    XcmVersionedXcm,
} from "@polkadot-api/descriptors" // npm run postinstall
import { Binary, getTypedCodecs } from "polkadot-api"

export async function getRemark(remark: string): Promise<string> {
    const codecs = await getTypedCodecs(passetHub)

    const remarkWithEventEncoded = codecs.tx.System.remark_with_event.enc({ remark: Binary.fromText(remark) });

    const xcm = XcmVersionedXcm.V5([
        XcmV5Instruction.Transact({
            origin_kind: XcmV2OriginKind.Native(),
            call: Binary.fromBytes(remarkWithEventEncoded),
        }),
    ])

    const xcmEncoded = codecs.apis.XcmPaymentApi.query_xcm_weight.args.enc([xcm])
    const xcmHex = Binary.fromBytes(xcmEncoded).asHex()
    return xcmHex
}