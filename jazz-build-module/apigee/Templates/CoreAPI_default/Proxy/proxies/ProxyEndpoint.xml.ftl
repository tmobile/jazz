<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ProxyEndpoint name="${proxy.name}ProxyEndpoint">
    <Description>${proxy.description}(generated using ProxyGen_v1.0.1)</Description>
	#cf_proxy_post_client_flow#     
	<FaultRules>
		#cf_proxy_faultrules_steps#
	</FaultRules>
	
	<DefaultFaultRule name="All">
		#cf_proxy_defaultfaultrules_steps#
	</DefaultFaultRule>
    
	<PreFlow name="PreFlow">
		<Request>
			#cf_proxy_preflow_request_steps#
		</Request>
		<Response>
			#cf_proxy_preflow_response_steps#
		</Response>
    </PreFlow>

    <Flows>
		<#list apis as api>
        <Flow name="${api.name}"> 
			#${api.name}_request#
			#${api.name}_response#
			<Condition>(proxy.pathsuffix MatchesPath &quot;${api.pathSuffix}&quot;) and (request.verb = &quot;${api.verb}&quot;)</Condition>
        </Flow>
		</#list>
		#cf_proxy_flows#
	</Flows>

    <PostFlow name="PostFlow">
		<Request>
			#cf_proxy_postflow_request_steps#
		</Request>
		<Response>
			#cf_proxy_postflow_response_steps#
		</Response>
    </PostFlow>

    <HTTPProxyConnection>
        <BasePath>${basePath}</BasePath>
		<#list proxy.virtualHostList as VirtualHost>
		<VirtualHost>${VirtualHost}</VirtualHost>
		</#list>
    </HTTPProxyConnection>

    #${proxy.name}_routerules#

</ProxyEndpoint>