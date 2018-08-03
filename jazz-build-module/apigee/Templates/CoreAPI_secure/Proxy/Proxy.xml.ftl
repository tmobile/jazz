<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<APIProxy revision="1" name="${proxy.name}Proxy">
    <ConfigurationVersion majorVersion="4" minorVersion="0"/>
    <Description>${proxy.description}</Description>
    <Policies>
    	<!-- Values will be populated by deployment script -->
    </Policies>	
    <ProxyEndpoints>
        <ProxyEndpoint>${proxy.name}ProxyEndpoint</ProxyEndpoint>
    </ProxyEndpoints>
    <Resources>
    	<!-- Values will be populated by deployment script -->
	</Resources>
    <TargetServers/>
    <TargetEndpoints>
    	<!-- Values will be populated by deployment script -->
		<#list proxy.targetEndpointList as targetEndpoint>
		<TargetEndpoint>${targetEndpoint}</TargetEndpoint>
		</#list>
    </TargetEndpoints>
	<validate>false</validate>
</APIProxy>