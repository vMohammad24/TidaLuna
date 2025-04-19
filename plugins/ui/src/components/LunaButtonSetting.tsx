import React from "react";

import { LunaButton, type LunaButtonProps } from "./LunaButton";
import { LunaSetting } from "./LunaSetting";
import type { LunaTitleValues } from "./LunaTitle";

export type LunaButtonSettingProps = LunaButtonProps & LunaTitleValues;

export const LunaButtonSetting = (props: LunaButtonSettingProps) => (
	<LunaSetting title={props.title} desc={props.desc}>
		<LunaButton
			{...props}
			sx={{
				marginLeft: "auto",
				marginRight: 2,
				height: 40,
				...props.sx,
			}}
			children={props.children}
		/>
	</LunaSetting>
);
