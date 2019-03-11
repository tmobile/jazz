<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<TargetEndpoint name="${targetName}_${targetServiceName}">
    <Description>${targetDescription}</Description>
	<FaultRules>
		#cf_target_faultrules_steps#
	</FaultRules>
	<DefaultFaultRule>
		#cf_target_defaultfaultrules_steps#
	</DefaultFaultRule>
    <PreFlow name="PreFlow">
		<Request>
			#cf_target_preflow_request_steps#
		</Request>
		<Response>
			#cf_target_preflow_response_steps#
		</Response>
    </PreFlow>
	<Flows>
		<#list targetSOAPActions as SOAPAction>
        <Flow name="${SOAPAction}"> 
        	<Condition>(capi.target.route.operation = &quot;${SOAPAction}&quot;)</Condition>         
			#${targetName}_${targetServiceName}_${SOAPAction}_req#
			#${targetName}_${targetServiceName}_${SOAPAction}_resp#
        </Flow>
		</#list>
		#cf_target_flows#
	</Flows>
    <PostFlow name="PostFlow">
		<Request>
			#cf_target_postflow_request_steps#
		</Request>
		<Response>
			#cf_target_postflow_response_steps#
		</Response>
    </PostFlow>
    <LocalTargetConnection>
        <Path>/v1/commonjazz</Path>
    </LocalTargetConnection>
</TargetEndpoint>