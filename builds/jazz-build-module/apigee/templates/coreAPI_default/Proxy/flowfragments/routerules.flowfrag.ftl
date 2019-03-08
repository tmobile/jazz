			<RouteRule name="NoRoute">
        		<Condition>(request.verb == "OPTIONS")</Condition>
    		</RouteRule>
			<!-- Target routing logic -->
			<#list proxy.targetEndpointList as targetEndpoint>
			<RouteRule name="${targetEndpoint}">
			  	<Condition>(capi.target.route.service = &quot;${targetEndpoint}&quot;)</Condition>
			  	<TargetEndpoint>${targetEndpoint}</TargetEndpoint>
			</RouteRule>
			</#list>