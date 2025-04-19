import React from "react";
import { LunaSetting } from "./LunaSetting";
import { LunaSwitch, type LunaSwitchProps } from "./LunaSwitch";
import type { LunaTitleValues } from "./LunaTitle";

export type LunaSwitchSettingProps = LunaSwitchProps & LunaTitleValues;
export const LunaSwitchSetting = (props: LunaSwitchSettingProps) => (
	<LunaSetting title={props.title} desc={props.desc}>
		<LunaSwitch {...props} />
	</LunaSetting>
);
