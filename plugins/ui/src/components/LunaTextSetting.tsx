import React from "react";

import { LunaSetting } from "./LunaSetting";
import { LunaText, type LunaTextProps } from "./LunaText";
import { type LunaTitleValues } from "./LunaTitle";

export type LunaTextSettingProps = LunaTextProps & LunaTitleValues;
export const LunaTextSetting = (props: LunaTextSettingProps) => (
	<LunaSetting title={props.title} desc={props.desc}>
		<LunaText fullWidth sx={{ height: "80%", marginTop: 0.25 }} {...props} placeholder={props.title} label={null} />
	</LunaSetting>
);
