import React, { ReactElement, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import {
  useHistoryOrder,
  useRequestHistory,
  deleteRequestHistory,
} from '../../reducers/history';
import Icon from '../../components/Icon';
import { get, NOTARY_API_LS_KEY, PROXY_API_LS_KEY } from '../../utils/storage';
import { urlify, download } from '../../utils/misc';
import { BackgroundActiontype } from '../../pages/Background/actionTypes';

export default function History(): ReactElement {
  const history = useHistoryOrder();

  return (
    <div className="flex flex-col flex-nowrap overflow-y-auto">
      {history.map((id) => {
        return <OneRequestHistory key={id} requestId={id} />;
      })}
    </div>
  );
}

function OneRequestHistory(props: { requestId: string }): ReactElement {
  const dispatch = useDispatch();
  const request = useRequestHistory(props.requestId);
  const navigate = useNavigate();
  const { status } = request || {};
  const requestUrl = urlify(request?.url || '');

  const onRetry = useCallback(async () => {
    const notaryUrl = await get(NOTARY_API_LS_KEY);
    const websocketProxyUrl = await get(PROXY_API_LS_KEY);
    chrome.runtime.sendMessage<any, string>({
      type: BackgroundActiontype.retry_prove_request,
      data: {
        id: props.requestId,
        notaryUrl,
        websocketProxyUrl,
      },
    });
  }, [props.requestId]);

  const onView = useCallback(() => {
    chrome.runtime.sendMessage<any, string>({
      type: BackgroundActiontype.verify_prove_request,
      data: request,
    });
    navigate('/verify/' + request?.id);
  }, [request]);

  const onDelete = useCallback(async () => {
    dispatch(deleteRequestHistory(props.requestId));
  }, [props.requestId]);

  return (
    <div className="flex flex-row flex-nowrap border rounded-md p-2 gap-1 hover:bg-slate-50 cursor-pointer">
      <div className="flex flex-col flex-nowrap flex-grow flex-shrink w-0">
        <div className="flex flex-row items-center text-xs">
          <div className="bg-slate-200 text-slate-400 px-1 py-0.5 rounded-sm">
            {request?.method}
          </div>
          <div className="text-black font-bold px-2 py-1 rounded-md overflow-hidden text-ellipsis">
            {requestUrl?.pathname}
          </div>
        </div>
        <div className="flex flex-row">
          <div className="font-bold text-slate-400">Host:</div>
          <div className="ml-2 text-slate-800">{requestUrl?.host}</div>
        </div>
        <div className="flex flex-row">
          <div className="font-bold text-slate-400">Notary API:</div>
          <div className="ml-2 text-slate-800">{request?.notaryUrl}</div>
        </div>
        <div className="flex flex-row">
          <div className="font-bold text-slate-400">TLS Proxy API: </div>
          <div className="ml-2 text-slate-800">
            {request?.websocketProxyUrl}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {status === 'success' && (
          <>
            <div
              className="flex flex-row flex-grow-0 gap-2 self-end items-center justify-end px-2 py-1 bg-slate-600 text-slate-200 hover:bg-slate-500 hover:text-slate-100 hover:font-bold"
              onClick={onView}
            >
              <Icon className="" fa="fa-solid fa-receipt" size={1} />
              <span className="text-xs font-bold">View Proof</span>
            </div>
            <div
              className="flex flex-row flex-grow-0 gap-2 self-end items-center justify-end px-2 py-1 bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-500 hover:font-bold"
              onClick={() =>
                download(`${request?.id}.json`, JSON.stringify(request?.proof))
              }
            >
              <Icon className="" fa="fa-solid fa-download" size={1} />
              <span className="text-xs font-bold">Download</span>
            </div>
          </>
        )}
        {(!status || status === 'error') && (
          <div
            className="flex flex-row flex-grow-0 gap-2 self-end items-center justify-end px-2 py-1 bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-500 hover:font-bold"
            onClick={onRetry}
          >
            <Icon fa="fa-solid fa-arrows-rotate" size={1} />
            <span className="text-xs font-bold">Retry</span>
          </div>
        )}
        {status === 'pending' && (
          <div className="flex flex-row flex-grow-0 gap-2 self-end items-center justify-end px-2 py-1 bg-slate-100 text-slate-300 font-bold">
            <Icon className="animate-spin" fa="fa-solid fa-spinner" size={1} />
            <span className="text-xs font-bold">Pending</span>
          </div>
        )}
        <div
          className="flex flex-row flex-grow-0 gap-2 self-end items-center justify-end px-2 py-1 bg-slate-100 text-slate-300 hover:bg-red-100 hover:text-red-500 hover:font-bold"
          onClick={onDelete}
        >
          <Icon className="" fa="fa-solid fa-trash" size={1} />
          <span className="text-xs font-bold">Delete</span>
        </div>
      </div>
    </div>
  );
}
