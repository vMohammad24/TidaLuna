import React from "react";
import { LunaSwitch, type LunaSwitchProps } from "../LunaSwitch";
import type { LunaTitleValues } from "../LunaTitle";
import { LunaSetting } from "./LunaSetting";

export type LunaSwitchSettingProps = LunaSwitchProps & LunaTitleValues;
export const LunaSwitchSetting = React.memo((props: LunaSwitchSettingProps) => (
	<LunaSetting title={props.title} desc={props.desc}>
		<LunaSwitch {...props} />
	</LunaSetting>
));
