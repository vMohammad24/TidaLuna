import React from "react";

import { LunaNumber, type LunaNumberProps } from "./LunaNumber";
import { LunaSetting } from "./LunaSetting";
import { type LunaTitleValues } from "./LunaTitle";

export type LunaNumberSettingProps = LunaNumberProps & LunaTitleValues;
export const LunaNumberSetting = (props: LunaNumberSettingProps) => (
	<LunaSetting title={props.title} desc={props.desc}>
		<LunaNumber size="small" sx={{ marginLeft: "auto" }} {...props} placeholder={props.title} label={null} />
	</LunaSetting>
);
